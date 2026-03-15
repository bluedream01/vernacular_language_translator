function Header() {
  return (
    <div className="header">
      <div className="icon-wrapper">
        {/* Animated Glow behind the icon */}
        <div className="icon-glow"></div>
        <svg
          className="icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="title">
        Vernacular <span className="title-accent">Language</span> Translator
      </h1>

      <p className="subtitle">
        Bridging gaps with AI-powered vernacular insights
      </p>
    </div>
  )
}

export default Header