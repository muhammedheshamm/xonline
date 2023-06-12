import Entry from './components/Entry/Entry';

function App() {

  const documentHeight = () => {
    const body = document.querySelector('body')
    const html = document.querySelector('html')
    const app = document.querySelector('.App')
    body.style.setProperty('--doc-height', `${window.innerHeight}px`)
    html.style.setProperty('--doc-height', `${window.innerHeight}px`)
    app.style.setProperty('--doc-height', `${window.innerHeight}px`)
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
