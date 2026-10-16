export default function Card({ children }) {
  return (
    <div
      className="
        w-full
        max-w-md
        rounded-3xl
        border border-slate-200
        bg-white
        p-6
        shadow-lg shadow-slate-900/5
        sm:p-8
      "
    >
      {children}
    </div>
  );
}
