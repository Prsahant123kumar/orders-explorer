import { useOrders } from './data/useOrders';
import { Grid } from './grid/Grid';

export default function App() {
  const state = useOrders();

  if (state.status === 'loading') return <p className="message">Loading orders...</p>;
  if (state.status === 'error') return <p className="message">Failed to load: {state.message}</p>;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Orders Explorer</h1>
        <span>{state.orders.length.toLocaleString('en-IN')} orders</span>
      </header>
      <main className="main">
        <Grid orders={state.orders} />
      </main>
    </div>
  );
}