const { createComponent, renderApp } = require('gruujs')
const { browserHistory, route, routeSub } = require('../src/index')

const timer = () => new Promise(resolve => setTimeout(resolve))

const goTo = (elem, path) => {
  elem._path = path
  elem.click(path)
}

describe('routing', () => {
  let router
  let page

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'

    page = text => createComponent({
      _type: 'span',
      textContent: text
    })

    router = createComponent({
      _type: 'div',
      children: [
        {
          children: [
            route('/examples/playground$', page('main')),
            {
              _type: 'div',
              children: [
                route('/examples/playground/page1$', page('page1'))
              ]
            },
            page('page3'),
            route('/examples/playground/page2$', page('page2'))
          ]
        }
      ]
    })

    const button = path => createComponent({
      _type: 'button',
      textContent: path,
      onclick () {
        browserHistory.goTo(path)
      }
    })

    const container = document.querySelector('#root')
    renderApp(container, [
      router,
      button('/examples/playground'),
      button('/examples/playground/page1'),
      button('/examples/playground/page2')
    ])
  })

  test('renders correctly', () => {
    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><div></div><span>page3</span></div><button>/examples/playground</button>' +
        '<button>/examples/playground/page1</button><button>/examples/playground/page2</button></div>')
  })

  test('content changes explicitly', () => {
    router.children = [
      page('page3'),
      {
        children: [
          route('/examples/playground$', page('main')),
          route('/examples/playground/page2$', page('page2'))
        ]
      },
      page('page3'),
      {
        _type: 'div',
        children: [
          route('/examples/playground/page1$', page('page1'))
        ]
      }
    ]

    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><span>page3</span><span>page3</span><div></div></div>' +
        '<button>/examples/playground</button><button>/examples/playground/page1</button>' +
        '<button>/examples/playground/page2</button></div>')
  })

  test('routing changes on click', async (done) => {
    const [b1, b2, b3] = document.getElementsByTagName('button')

    b1.click()
    await timer()

    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><span>main</span><div></div><span>page3</span></div>' +
        '<button>/examples/playground</button>' +
        '<button>/examples/playground/page1</button><button>/examples/playground/page2</button></div>')

    router.children = [
      page('page3'),
      {
        children: [
          route('/examples/playground$', page('main')),
          route('/examples/playground/page2$', page('page2'))
        ]
      },
      page('page3'),
      {
        _type: 'div',
        children: [
          route('/examples/playground/page1$', page('page1'))
        ]
      }
    ]

    b3.click()
    await timer()

    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><span>page3</span><span>page2</span><span>page3</span><div></div></div>' +
        '<button>/examples/playground</button><button>/examples/playground/page1</button>' +
        '<button>/examples/playground/page2</button></div>')

    b2.click()
    await timer()

    expect(document.body.innerHTML)
      .toBe('<div id="root"><div><span>page3</span><span>page3</span><div><span>page1</span></div></div>' +
        '<button>/examples/playground</button><button>/examples/playground/page1</button>' +
        '<button>/examples/playground/page2</button></div>')

    done()
  }, 100)
})

describe('routeSub', () => {
  const init = () => {
    const fn = jest.fn()
    document.body.innerHTML = '<div id="root"></div>'

    routeSub('/hello/:id/:counter', (values) => {
      fn(values)
    })

    const container = document.querySelector('#root')
    renderApp(container, [{
      _type: 'button',
      onclick () {
        browserHistory.goTo(this._node._path)
      }
    }])

    return { fn }
  }

  test('runs on location change', async (done) => {
    const { fn } = init()
    expect(fn.mock.calls.length).toBe(0)

    const buttonEl = document.querySelector('button')

    goTo(buttonEl, '/hello/65/20')
    expect(fn.mock.calls.length).toBe(1)
    expect(fn.mock.calls[0][0]).toEqual({ id: '65', counter: '20' })

    goTo(buttonEl, '/hello/12/33/dsf')
    expect(fn.mock.calls.length).toBe(2)
    expect(fn.mock.calls[1][0]).toEqual({ id: '12', counter: '33' })

    goTo(buttonEl, '/test')
    expect(fn.mock.calls.length).toBe(2)

    done()
  }, 150)
})

describe('onpopstate', () => {
  const init = () => {
    const fn = jest.fn()
    document.body.innerHTML = '<div id="root"></div>'

    routeSub('/test/:id$', (values) => {
      fn(values)
    })

    const container = document.querySelector('#root')
    renderApp(container, [{
      _type: 'button',
      children: route('/button', { _type: 'div', textContent: 'CLICK' }),
      onclick () {
        browserHistory.goTo(this._node._path)
      }
    }])

    return { fn }
  }

  test('updates ui', async (done) => {
    const { fn } = init()
    expect(fn.mock.calls.length).toBe(0)

    const buttonEl = document.querySelector('button')
    expect(buttonEl.innerHTML).toBe('')

    goTo(buttonEl, '/test/54')
    expect(fn.mock.calls.length).toBe(1)
    expect(fn.mock.calls[0][0]).toEqual({ id: '54' })
    expect(buttonEl.innerHTML).toBe('')

    goTo(buttonEl, '/button')
    await timer()
    expect(fn.mock.calls.length).toBe(1)
    expect(buttonEl.innerHTML).toBe('<div>CLICK</div>')

    goTo(buttonEl, '/test/54')
    await timer()
    expect(fn.mock.calls.length).toBe(2)
    expect(fn.mock.calls[0][0]).toEqual({ id: '54' })
    expect(buttonEl.innerHTML).toBe('')

    goTo(buttonEl, '/button')
    await timer()
    expect(fn.mock.calls.length).toBe(2)
    expect(buttonEl.innerHTML).toBe('<div>CLICK</div>')

    done()
  }, 150)
})
