import { useOrders } from './data/useOrders';

export default function App() {
  const state = useOrders();

  if (state.status === 'loading') return <p>Loading orders...</p>;
  if (state.status === 'error') return <p>Failed to load: {state.message}</p>;
  return (
    <p>
      {state.orders.length} unique orders (from {state.rawCount} records)
    </p>
  );
}