import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import BrowserslistModule from '../lib/BrowserslistModule.js'

/**
 * BrowserslistModule extends AbstractModule and requires App.instance.
 * We test what's possible without a full running app.
 */

function createInstance (overrides = {}) {
  const mockApp = {
    waitForModule: mock.fn(async () => ({
      path: '/tmp/framework',
      preBuildHook: { tap: mock.fn() }
    })),
    errors: {
      BROWSERSLIST_UPDATE_FAILED: {
        setData: mock.fn(function () { return this })
      }
    },
    dependencyloader: {
      moduleLoadedHook: { tap: () => {}, untap: () => {} }
    },
    ...overrides
  }

  const originalInit = BrowserslistModule.prototype.init
  BrowserslistModule.prototype.init = async function () {}

  const instance = new BrowserslistModule(mockApp, { name: 'adapt-authoring-browserslist' })

  BrowserslistModule.prototype.init = originalInit

  instance.path = '/tmp/framework'
  instance.runOnBuild = false
  instance.updateInterval = 0

  return { instance, mockApp }
}

describe('BrowserslistModule', () => {
  describe('constructor', () => {
    it('should create an instance', () => {
      const { instance } = createInstance()
      assert.ok(instance)
    })

    it('should be an instance of BrowserslistModule', () => {
      const { instance } = createInstance()
      assert.ok(instance instanceof BrowserslistModule)
    })
  })

  describe('#init()', () => {
    it('should wait for adaptframework module', async () => {
      const { instance, mockApp } = createInstance()
      const mockFramework = {
        path: '/test/path',
        preBuildHook: { tap: mock.fn() }
      }
      mockApp.waitForModule = mock.fn(async () => mockFramework)
      instance.getConfig = mock.fn((key) => {
        if (key === 'runOnBuild') return false
        if (key === 'updateInterval') return 0
        return undefined
      })

      await instance.init()

      assert.equal(mockApp.waitForModule.mock.calls.length, 1)
      assert.equal(mockApp.waitForModule.mock.calls[0].arguments[0], 'adaptframework')
    })

    it('should set path from framework', async () => {
      const { instance, mockApp } = createInstance()
      const mockFramework = {
        path: '/custom/path',
        preBuildHook: { tap: mock.fn() }
      }
      mockApp.waitForModule = mock.fn(async () => mockFramework)
      instance.getConfig = mock.fn(() => false)

      await instance.init()

      assert.equal(instance.path, '/custom/path')
    })

    it('should tap preBuildHook when runOnBuild is true', async () => {
      const { instance, mockApp } = createInstance()
      const tapFn = mock.fn()
      const mockFramework = {
        path: '/test',
        preBuildHook: { tap: tapFn }
      }
      mockApp.waitForModule = mock.fn(async () => mockFramework)
      instance.getConfig = mock.fn((key) => {
        if (key === 'runOnBuild') return true
        if (key === 'updateInterval') return 0
        return undefined
      })

      await instance.init()

      assert.equal(tapFn.mock.calls.length, 1)
    })

    it('should not tap preBuildHook when runOnBuild is false', async () => {
      const { instance, mockApp } = createInstance()
      const tapFn = mock.fn()
      const mockFramework = {
        path: '/test',
        preBuildHook: { tap: tapFn }
      }
      mockApp.waitForModule = mock.fn(async () => mockFramework)
      instance.getConfig = mock.fn(() => false)

      await instance.init()

      assert.equal(tapFn.mock.calls.length, 0)
    })
  })

  describe('#update()', () => {
    it('should be a method on the instance', () => {
      const { instance } = createInstance()
      assert.equal(typeof instance.update, 'function')
    })

    it('should default handleError to false', () => {
      const { instance } = createInstance()
      // Default parameter means .length is 0
      assert.equal(instance.update.length, 0)
    })
  })
})
