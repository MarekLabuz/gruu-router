const { createComponent, renderApp } = require('gruujs')
const { browserHistory, route } = require('../src/index')

const timer = () => new Promise(resolve => setTimeout(resolve))

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
