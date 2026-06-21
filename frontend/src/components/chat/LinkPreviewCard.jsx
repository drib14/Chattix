const LinkPreviewCard = ({ preview }) => {
  if (!preview) return null;

  const { url, title, description, image } = preview;

  const getDomainName = (link) => {
    try {
      const parsed = new URL(link);
      return parsed.hostname.replace('www.', '');
    } catch (e) {
      return '';
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={styles.card}
      className="clay-card"
      id={`link-preview-card-${url}`}
      onClick={(e) => e.stopPropagation()} // Stop bubble triggering click events
    >
      {image && (
        <div style={styles.imageWrapper}>
          <img src={image} alt="Link Preview" style={styles.image} id={`link-preview-img-${url}`} />
        </div>
      )}

      <div style={styles.content}>
        <span style={styles.domain}>{getDomainName(url)}</span>
        <h4 style={styles.title} className="text-truncate">{title || url}</h4>
        {description && (
          <p style={styles.desc}>
            {description.length > 90 ? `${description.substring(0, 90)}...` : description}
          </p>
        )}
      </div>
    </a>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '300px',
    borderRadius: '16px',
    overflow: 'hidden',
    textDecoration: 'none',
    background: '#ffffff',
    marginTop: '6px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  imageWrapper: {
    width: '100%',
    height: '140px',
    overflow: 'hidden',
    background: '#f8fafc',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    textAlign: 'left',
  },
  domain: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--clay-primary)',
    letterSpacing: '0.5px',
  },
  title: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  desc: {
    fontSize: '11.5px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
};

export default LinkPreviewCard;
