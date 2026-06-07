const AuthInput = ({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  rightElement,
  inputClassName = '',
  labelClassName = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id || name} className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={id || name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`modern-input auth-input-field w-full h-[56px] px-4 ${rightElement ? 'pr-12' : 'pr-4'} text-sm ${inputClassName}`.trim()}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center z-10">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthInput;
