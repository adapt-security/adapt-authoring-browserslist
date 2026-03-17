import { AbstractModule, spawn } from 'adapt-authoring-core'
/**
 * Makes sure browserslist is up to date for the framework build process
 * @memberof browserslist
 * @extends {AbstractModule}
 */
class BrowserslistModule extends AbstractModule {
  /** @override */
  async init () {
    const framework = await this.app.waitForModule('adaptframework')

    this.path = framework.path
    this.runOnBuild = this.getConfig('runOnBuild')
    this.updateInterval = this.getConfig('updateInterval')

    await this.update(true)

    if (this.runOnBuild) framework.preBuildHook.tap(() => this.update())
    if (this.updateInterval > 0) {
      setInterval(() => this.update(true), this.updateInterval)
    }
  }

  async update (handleError = false) {
    try {
      this.log('info', 'updating db')
      this.log('verbose', await spawn({ cmd: 'npm', args: ['install', 'caniuse-lite@latest', '--no-save'], cwd: this.path }))
      this.log('info', 'db update complete')
    } catch (e) {
      const error = this.app.errors.BROWSERSLIST_UPDATE_FAILED.setData({ error: e.data.error })
      if (!handleError) throw error
      this.log('error', error)
    }
  }
}

export default BrowserslistModule
