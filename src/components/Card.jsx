// client/src/components/Card.jsx
const Card = ({ children, className = '', style = {}, onClick }) => (
  <div
    onClick={onClick}
    className={`royal-card ${onClick ? 'cursor-pointer transition-all active:scale-98' : ''} ${className}`}
    style={style}
  >
    {children}
  </div>
);

export default Card;
