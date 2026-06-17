import toast from 'react-hot-toast';

const UNDO_MS = 5000;

export function undoableDelete({ label, onRemove, onRestore, commit }) {
  onRemove();
  let undone = false;

  const timer = setTimeout(async () => {
    if (undone) return;
    try {
      await commit();
    } catch {
      onRestore();
      toast.error(`Failed to delete ${label}`);
    }
  }, UNDO_MS);

  toast(
    (t) => (
      <span className="flex items-center gap-3">
        {label} deleted
        <button
          onClick={() => {
            undone = true;
            clearTimeout(timer);
            onRestore();
            toast.dismiss(t.id);
          }}
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Undo
        </button>
      </span>
    ),
    { duration: UNDO_MS }
  );
}
