import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          name={name}
          type={
            isPassword && showPassword
              ? "text"
              : type
          }
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="
            w-full
            rounded-xl
            border
            border-gray-300
            bg-white
            px-4
            py-3
            pr-12
            outline-none
            transition
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-200
          "
        />

        {isPassword && (
          <button
            type="button"
            onClick={() =>
              setShowPassword(!showPassword)
            }
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-gray-500
            "
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}