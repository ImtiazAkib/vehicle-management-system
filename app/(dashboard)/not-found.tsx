export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-start gap-2">
      <h1>Not found</h1>
      <p className="text-muted-foreground text-sm">That page does not exist, or you do not have access to it.</p>
    </div>
  );
}
