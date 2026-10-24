import Icon from './Icon.jsx';

export default function WorkspaceToggle({ workspace, onToggle, className }) {
  const next = workspace === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className={className}
      onClick={() => onToggle(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Icon name={workspace === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
