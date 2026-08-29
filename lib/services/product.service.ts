import { Product } from '@/models/product.model';
import { SupplierProfile } from '@/models/supplier-profile.model';
import { ProductDto, productFromEntity } from '@/types';

import { CODES } from '@/constants/codes.const';

import { createLoggerWithContext } from '@/lib/logger';
import { connectToDatabase } from '@/lib/mongodb';
import { ListResult, SingleResult, createError, listFailure, listSuccess, singleFailure, singleSuccess } from '@/lib/result';
import type { ProductBrowseOutput, ProductCreateOutput, ProductUpdateOutput } from '@/lib/schemas';

import { resolveSupplierProfileId } from './supplier.service';

import type { ProductEntity } from '@/models/product.model';

const log = createLoggerWithContext('product.service');

const DATABASE = CODES.DATABASE.MARKETPLACE;
const VALIDATION = CODES.VALIDATION.MARKETPLACE;
const BUSINESS = CODES.BUSINESS.MARKETPLACE;

/** How many products a browse page shows. */
export const PRODUCT_PAGE_SIZE = 12;

/** Whether a Mongo error is a duplicate-key (11000) violation. */
function isDuplicateKey(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000);
}

/** Escape a user's free-text query so it is matched literally, never as a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The product catalog. Supplier-facing writes are scoped to the caller's own `SupplierProfile` — the seller
 * is the session, never the form — and the public browse joins to that profile and shows only the active
 * products of verified sellers.
 */
export class ProductService {
  /**
   * A supplier's own catalog, active and inactive, newest first.
   *
   * @param supplierUserId - The signed-in supplier account.
   *
   * @returns The products, or a failure. An account without a profile yet lists nothing.
   */
  public async listForSupplier(supplierUserId: string): Promise<ListResult<ProductDto>> {
    try {
      await connectToDatabase();

      const supplierId = await resolveSupplierProfileId(supplierUserId);

      if (!supplierId) {
        return listSuccess([]);
      }

      const products = await Product.find({ supplier: supplierId }).sort({ createdAt: -1 }).lean<ProductEntity[]>();

      return listSuccess(products.map(productFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Listing supplier products failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * List a product for the signed-in supplier. The seller is bound from the session, and a duplicate `sku`
   * is refused with a marketplace code before the driver ever raises `E11000` — the unique index is the law,
   * this pre-check is the manners.
   *
   * @param supplierUserId - The signed-in supplier account.
   * @param input - Validated product fields — no `supplier` among them.
   *
   * @returns The created product, or a failure.
   */
  public async create(supplierUserId: string, input: ProductCreateOutput): Promise<SingleResult<ProductDto>> {
    try {
      await connectToDatabase();

      const supplierId = await resolveSupplierProfileId(supplierUserId);

      if (!supplierId) {
        return singleFailure(createError(VALIDATION.PROFILE_NOT_FOUND.CODE, VALIDATION.PROFILE_NOT_FOUND.MESSAGE));
      }

      const existing = await Product.findOne({ sku: input.sku }).select('_id').lean();

      if (existing) {
        return singleFailure(createError(BUSINESS.DUPLICATE_SKU.CODE, BUSINESS.DUPLICATE_SKU.MESSAGE, 'sku'));
      }

      const product = await Product.create({ ...input, supplier: supplierId });

      return singleSuccess(productFromEntity(product));
    } catch (error) {
      if (isDuplicateKey(error)) {
        return singleFailure(createError(BUSINESS.DUPLICATE_SKU.CODE, BUSINESS.DUPLICATE_SKU.MESSAGE, 'sku'));
      }

      log.error({ err: error }, 'Creating a product failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Update one of the supplier's own products. Any `supplier` in the payload is ignored — the write is
   * scoped through the caller's profile, so one supplier can never edit another's listing.
   *
   * @param supplierUserId - The signed-in supplier account.
   * @param productId - The product to update.
   * @param input - Validated partial fields; blank ones are left unchanged.
   *
   * @returns The updated product, or a failure.
   */
  public async update(supplierUserId: string, productId: string, input: ProductUpdateOutput): Promise<SingleResult<ProductDto>> {
    try {
      await connectToDatabase();

      const supplierId = await resolveSupplierProfileId(supplierUserId);

      if (!supplierId) {
        return singleFailure(createError(VALIDATION.PROFILE_NOT_FOUND.CODE, VALIDATION.PROFILE_NOT_FOUND.MESSAGE));
      }

      const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
      const product = await Product.findOneAndUpdate(
        { _id: productId, supplier: supplierId },
        { $set: changes },
        { new: true }
      ).lean<ProductEntity | null>();

      if (!product) {
        return singleFailure(createError(BUSINESS.NOT_OWNER.CODE, BUSINESS.NOT_OWNER.MESSAGE));
      }

      return singleSuccess(productFromEntity(product));
    } catch (error) {
      log.error({ err: error }, 'Updating a product failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * Activate or deactivate one of the supplier's own products — the visibility switch, scoped to the caller.
   *
   * @param supplierUserId - The signed-in supplier account.
   * @param productId - The product to toggle.
   * @param isActive - The new active state.
   *
   * @returns The updated product, or a failure.
   */
  public async setActive(supplierUserId: string, productId: string, isActive: boolean): Promise<SingleResult<ProductDto>> {
    try {
      await connectToDatabase();

      const supplierId = await resolveSupplierProfileId(supplierUserId);

      if (!supplierId) {
        return singleFailure(createError(VALIDATION.PROFILE_NOT_FOUND.CODE, VALIDATION.PROFILE_NOT_FOUND.MESSAGE));
      }

      const product = await Product.findOneAndUpdate(
        { _id: productId, supplier: supplierId },
        { $set: { isActive } },
        { new: true }
      ).lean<ProductEntity | null>();

      if (!product) {
        return singleFailure(createError(BUSINESS.NOT_OWNER.CODE, BUSINESS.NOT_OWNER.MESSAGE));
      }

      return singleSuccess(productFromEntity(product));
    } catch (error) {
      log.error({ err: error }, 'Toggling a product failed');

      return singleFailure(createError(DATABASE.WRITE_FAILED.CODE, DATABASE.WRITE_FAILED.MESSAGE));
    }
  }

  /**
   * The public browse: active products of verified sellers only, narrowed by category, free-text and a
   * min/max price range, one page at a time. An unverified supplier's listings never appear here.
   *
   * @param query - The parsed filter contract from the URL.
   *
   * @returns The page of matching products, or a failure.
   */
  public async browse(query: ProductBrowseOutput): Promise<ListResult<ProductDto>> {
    try {
      await connectToDatabase();

      const verifiedIds = await SupplierProfile.find({ isVerified: true }).distinct('_id');

      const filter: Record<string, unknown> = { supplier: { $in: verifiedIds }, isActive: true };

      if (query.category) {
        filter.category = query.category;
      }

      if (query.q) {
        filter.name = { $regex: escapeRegExp(query.q), $options: 'i' };
      }

      if (query.minPrice != null || query.maxPrice != null) {
        filter.price = {
          ...(query.minPrice != null ? { $gte: query.minPrice } : {}),
          ...(query.maxPrice != null ? { $lte: query.maxPrice } : {}),
        };
      }

      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * PRODUCT_PAGE_SIZE)
        .limit(PRODUCT_PAGE_SIZE)
        .lean<ProductEntity[]>();

      return listSuccess(products.map(productFromEntity));
    } catch (error) {
      log.error({ err: error }, 'Browsing products failed');

      return listFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }

  /**
   * One product for the public detail page — resolved only when it is active and its seller is verified, so
   * an invisible listing is a 404 rather than a leak.
   *
   * @param productId - The product to load.
   *
   * @returns The product, or a not-found failure.
   */
  public async getPublicProduct(productId: string): Promise<SingleResult<ProductDto>> {
    try {
      await connectToDatabase();

      const product = await Product.findById(productId).lean<ProductEntity | null>();

      if (!product || !product.isActive) {
        return singleFailure(createError(VALIDATION.PRODUCT_NOT_FOUND.CODE, VALIDATION.PRODUCT_NOT_FOUND.MESSAGE));
      }

      const supplier = await SupplierProfile.findById(product.supplier).select('isVerified').lean<{ isVerified: boolean } | null>();

      if (!supplier || !supplier.isVerified) {
        return singleFailure(createError(VALIDATION.PRODUCT_NOT_FOUND.CODE, VALIDATION.PRODUCT_NOT_FOUND.MESSAGE));
      }

      return singleSuccess(productFromEntity(product));
    } catch (error) {
      log.error({ err: error }, 'Loading a product failed');

      return singleFailure(createError(DATABASE.READ_FAILED.CODE, DATABASE.READ_FAILED.MESSAGE));
    }
  }
}
