const ChattixLogo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: { box: 'w-9 h-9', icon: 18, text: 'text-base' },
    md: { box: 'w-11 h-11', icon: 22, text: 'text-lg' },
    lg: { box: 'w-14 h-14', icon: 28, text: 'text-2xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-2 min-w-0 max-w-full ${className}`}>
      <div
        className={`${s.box} rounded-xl bg-chattix-primary flex items-center justify-center shadow-md shrink-0`}
      >
        <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3C7.03 3 3 6.58 3 11c0 2.76 1.56 5.21 4 6.72V21l5-2.5 5 2.5v-3.28C19.44 16.21 21 13.76 21 11c0-4.42-4.03-8-9-8z"
            fill="white"
          />
        </svg>
      </div>
      {showText && (
        <span className={`${s.text} font-bold text-chattix-primary tracking-wide truncate`}>
          CHATTIX
        </span>
      )}
    </div>
  );
};

export default ChattixLogo;
