export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <Icon size={26} />
        </div>
      )}

      <div>
        {title && <h3 className="font-semibold text-gray-800">{title}</h3>}

        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}
