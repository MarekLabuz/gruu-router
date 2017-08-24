const { createComponent } = require('gruujs')

const GruuRouter = ((function () {
  const isPathCorrect = (regex, locationPath) => regex.test(locationPath)
  const getParamsValues = (path, params) => path
    .split('/')
    .reduce((acc, v, i) => Object.assign({}, acc, params[i] ? { [params[i]]: v } : {}))
  const getPathRegex = path => new RegExp(`^${path.replace(/:[^/]*/g, '[^/]*')}`)

  const browserHistory = createComponent({
    subs: [],
    state: {
      locationPath: window.location.pathname
    },
    goTo (path, popEvent) {
      browserHistory.state.locationPath = path
      if (!popEvent) {
        window.history.pushState(null, null, path)
      }
      browserHistory.subs.forEach(([regex, params, fn]) => {
        if (isPathCorrect(regex, path)) {
          fn(getParamsValues(path, params))
        }
      })
    },
    addSub (sub) {
      this.subs.push(sub)
    }
  })

  const route = (path, component) => {
    const params = path.split('/').map(v => (/:[^/]*/g).test(v) && v.slice(1))
    const regex = getPathRegex(path)
    return createComponent({
      $children () {
        const currentPath = browserHistory.state.locationPath
        if (isPathCorrect(regex, currentPath)) {
          const componentAsAFunction = typeof component === 'function'
          const values = !componentAsAFunction ? [] : getParamsValues(currentPath, params)
          const comp = componentAsAFunction ? component(values) : component
          return [comp]
        }
        return []
      }
    })
  }

  const routeSub = (path, fn) => {
    const params = path.split('/').map(v => (/:[^/]*/g).test(v) && v.slice(1))
    const regex = getPathRegex(path)
    browserHistory.addSub([regex, params, fn])
  }

  window.onpopstate = () => {
    browserHistory.goTo(window.location.pathname, true)
  }

  return { browserHistory, route, routeSub }
})())

if (typeof module !== 'undefined') {
  module.exports = GruuRouter
}
