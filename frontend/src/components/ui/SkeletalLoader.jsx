const SkeletalLoader = ({ type = 'list', count = 5 }) => {
  const renderItems = () => {
    const items = [];
    for (let i = 0; i < count; i++) {
      if (type === 'list') {
        items.push(
          <div key={i} style={styles.listItem} className="pulse-skeletal">
            <div style={styles.avatar} className="skeleton-box" />
            <div style={styles.textContainer}>
              <div style={styles.titleLine} className="skeleton-box" />
              <div style={styles.subLine} className="skeleton-box" />
            </div>
          </div>
        );
      } else if (type === 'bubble') {
        const isOwn = i % 2 === 0;
        items.push(
          <div key={i} style={{
            ...styles.bubbleRow,
            justifyContent: isOwn ? 'flex-end' : 'flex-start'
          }} className="pulse-skeletal">
            {!isOwn && <div style={styles.bubbleAvatar} className="skeleton-box" />}
            <div style={{
              ...styles.bubble,
              borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              width: i % 3 === 0 ? '180px' : i % 3 === 1 ? '120px' : '240px',
              height: '40px',
            }} className="skeleton-box" />
          </div>
        );
      }
    }
    return items;
  };

  return <div style={styles.container}>{renderItems()}</div>;
};

const styles = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  avatar: {
    width: '46px',
    height: '46px',
    borderRadius: '16px',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  titleLine: {
    width: '45%',
    height: '14px',
  },
  subLine: {
    width: '80%',
    height: '10px',
  },
  bubbleRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    width: '100%',
  },
  bubbleAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    flexShrink: 0,
  },
  bubble: {
    maxWwidth: '70%',
  },
};

export default SkeletalLoader;
