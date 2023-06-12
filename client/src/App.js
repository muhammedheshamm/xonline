import Entry from './components/Entry/Entry';

function App() {

  const documentHeight = () => {
    const doc = document.documentElement
    doc.style.setProperty('--doc-height', `${window.innerHeight}px`)
  }
  window.addEventListener('resize', documentHeight)
  documentHeight()

  return (
    <div className="App">
      <Entry />
    </div>
  );
}

export default App;
