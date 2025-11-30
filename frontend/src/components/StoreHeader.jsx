export default function StoreHeader({ store }) {
  return (
    <header className="store-header">
      <h1>{store.name}</h1>
      <p>{store.description}</p>
    </header>
  );
}
