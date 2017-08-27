const { createComponent } = typeof module !== 'undefined' ? require('gruujs') : Gruu

const GruuRouter = ((function () {
  const isPathCorrect = (regex, locationPath) => regex.test(locationPath)
  const getParams = path => path.replace(/(\^|\$)/g, '').split('/').map(v => (/:[^/]*/g).test(v) && v.slice(1))
  const getParamsValues = (path, regex, params) => path.match(regex)[0]
    .split('/')
    .reduce((acc, v, i) => Object.assign({}, acc, params[i] ? { [params[i]]: v } : {}))
  const getPathRegex = path => new RegExp(path.replace(/:[^/$]*/g, '[^/]*'))

  const router = createComponent({
    subs: [],
    state: {
      locationPath: window.location.pathname
    },
    goTo (path, popEvent) {
      router.state.locationPath = path

      router.subs.forEach(([regex, params, fn]) => {
        if (isPathCorrect(regex, path)) {
          fn(getParamsValues(path, regex, params))
        }
      })

      if (!popEvent) {
        window.history.pushState(null, null, path)
      }
    },
    addSub (sub) {
      router.subs.push(sub)
      return () => {
        router.subs = router.subs.filter(s => s !== sub)
      }
    }
  })

  const route = (path, component) => {
    const params = getParams(path)
    const regex = getPathRegex(path)
    return createComponent({
      $children () {
        const currentPath = router.state.locationPath
        // console.log(regex, currentPath)
        if (isPathCorrect(regex, currentPath)) {
          const componentAsAFunction = typeof component === 'function'
          const values = !componentAsAFunction ? [] : getParamsValues(currentPath, regex, params)
          const comp = componentAsAFunction ? component(values) : component
          return [comp]
        }
        return []
      }
    })
  }

  const routeSub = (path, fn) => {
    const params = getParams(path)
    const regex = getPathRegex(path)
    const currentPath = window.location.pathname
    if (isPathCorrect(regex, currentPath)) {
      setTimeout(() => {
        fn(getParamsValues(currentPath, regex, params))
      })
    }
    return router.addSub([regex, params, fn])
  }

  window.onpopstate = () => {
    router.goTo(window.location.pathname, true)
  }

  return { router, route, routeSub }
})())

if (typeof module !== 'undefined') {
  module.exports = GruuRouter
}
