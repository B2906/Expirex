export default function ErrorState({ message = 'Something went wrong while loading this view.' }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      {message}
    </div>
  )
}
