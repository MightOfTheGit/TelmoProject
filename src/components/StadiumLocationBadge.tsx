interface StadiumLocationBadgeProps {
  section: string;
}
export function StadiumLocationBadge({ section }: StadiumLocationBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
      {section}
    </span>
  );
}
