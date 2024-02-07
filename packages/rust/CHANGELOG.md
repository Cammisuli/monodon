# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [1.3.2](https://github.com/Cammisuli/monodon/compare/rust-1.3.1...rust-1.3.2) (2023-11-30)


### Bug Fixes

* **rust:** add dependencies to package.json and use new eslint rule ([1e01667](https://github.com/Cammisuli/monodon/commit/1e0166713d058d159cd13ca7fd343f7191b76a35))
* **rust:** normalize root path ([a2f0e9e](https://github.com/Cammisuli/monodon/commit/a2f0e9ef808144d2064088f50c552043cf9fc241))

## [1.3.1](https://github.com/Cammisuli/monodon/compare/rust-1.3.0...rust-1.3.1) (2023-11-20)


### Bug Fixes

* **rust:** increase buffer size for cargo commands ([16ef0cd](https://github.com/Cammisuli/monodon/commit/16ef0cdfe1a65492ab7429540fee0c9493d22250))

## [1.3.0](https://github.com/Cammisuli/monodon/compare/rust-1.2.0...rust-1.3.0) (2023-11-20)


### Features

* **rust:** add option to change package name ([#28](https://github.com/Cammisuli/monodon/issues/28)) ([2447dd0](https://github.com/Cammisuli/monodon/commit/2447dd01e69759963b2f9b6d5b66f7a2263ca8b3))
* **rust:** move to nx plugin v2 ([#27](https://github.com/Cammisuli/monodon/issues/27)) ([7ad56a7](https://github.com/Cammisuli/monodon/commit/7ad56a7113405e8e5a9facecd0152e7940ce548b))


### Bug Fixes

* **rust:** make sure that the project graph is populated properly for nx ([#30](https://github.com/Cammisuli/monodon/issues/30)) ([13973c9](https://github.com/Cammisuli/monodon/commit/13973c90a65a08b70d2b6f439cf1ff403c7071ea))

## [1.2.0](https://github.com/Cammisuli/monodon/compare/rust-1.1.2...rust-1.2.0) (2023-06-30)


### Features

* **rust:** add zig flag for the napi executor ([#21](https://github.com/Cammisuli/monodon/issues/21)) ([ac3a876](https://github.com/Cammisuli/monodon/commit/ac3a876f7a74fbbee90285ada58cf8999afe884c))


### Bug Fixes

* **rust:** update monodon/rust dependencies to 16.4.1 ([0f1e47d](https://github.com/Cammisuli/monodon/commit/0f1e47d67f6619ecfeb473b33b2d0562822952b1))

## [1.1.2](https://github.com/Cammisuli/monodon/compare/rust-1.1.1...rust-1.1.2) (2023-04-17)


### Bug Fixes

* **rust:** normalize path and use `addStaticDependency` ([0029fc6](https://github.com/Cammisuli/monodon/commit/0029fc6e5735dad6ffef71807c51df21bafabd38))

## [1.1.1](https://github.com/Cammisuli/monodon/compare/rust-1.1.0...rust-1.1.1) (2023-03-09)


### Bug Fixes

* **rust:** handle existing external nodes ([#16](https://github.com/Cammisuli/monodon/issues/16)) ([e93da1d](https://github.com/Cammisuli/monodon/commit/e93da1db5decc68d7424945b329a92e78e072fe1))

## [1.1.0](https://github.com/Cammisuli/monodon/compare/rust-1.0.0...rust-1.1.0) (2023-02-28)


### Features

* update nx to 15.8.0 ([#15](https://github.com/Cammisuli/monodon/issues/15)) ([de3e4b8](https://github.com/Cammisuli/monodon/commit/de3e4b8aada8e3ca4fa30f019bfb65e43a82747b))


### Bug Fixes

* **rust:** kill child process on SIGINT ([#13](https://github.com/Cammisuli/monodon/issues/13)) ([918ca30](https://github.com/Cammisuli/monodon/commit/918ca30562c4df4b0d2854b18ec311072ec7ff61))
* **rust:** update deprecated toml package version ([#14](https://github.com/Cammisuli/monodon/issues/14)) ([b19b3d7](https://github.com/Cammisuli/monodon/commit/b19b3d71889583ab03304a9f339d38f33eb14524))

## [1.0.0](https://github.com/Cammisuli/monodon/compare/rust-0.4.4...rust-1.0.0) (2023-02-17)


### Bug Fixes

* **rust:** do not spawn cmd windows on Windows ([a0922bc](https://github.com/Cammisuli/monodon/commit/a0922bc110c2c756a83c6bc7fcada661ccb819df))

## [0.4.4](https://github.com/Cammisuli/monodon/compare/rust-0.4.3...rust-0.4.4) (2023-01-30)


### Bug Fixes

* **rust:** skip trying to build on vercel ([d855cb2](https://github.com/Cammisuli/monodon/commit/d855cb2ac917bed9666177afe4ac08686c57d6e9))

## [0.4.3](https://github.com/Cammisuli/monodon/compare/rust-0.4.2...rust-0.4.3) (2023-01-30)


### Bug Fixes

* **rust:** do not include toolchain +stable by default ([c5f2e30](https://github.com/Cammisuli/monodon/commit/c5f2e30c385153fb87e07442f0276189f84bbd0b))

## [0.4.2](https://github.com/Cammisuli/monodon/compare/rust-0.4.1...rust-0.4.2) (2023-01-30)


### Bug Fixes

* **rust:** add nrwl/devkit dep and set outputCapture to pipe for tests ([df38115](https://github.com/Cammisuli/monodon/commit/df3811520bb53a681e8330ffbc7d54df6fdbcd54))

## [0.4.1](https://github.com/Cammisuli/monodon/compare/rust-0.4.0...rust-0.4.1) (2023-01-19)


### Bug Fixes

* **rust:** add target option for napi ([bf2fb03](https://github.com/Cammisuli/monodon/commit/bf2fb038042d2ba6f03b0e4eb4db2ccd57852a84))
* **rust:** handle empty apps or libs dir ([#11](https://github.com/Cammisuli/monodon/issues/11)) ([e6cc51e](https://github.com/Cammisuli/monodon/commit/e6cc51ee888a8fa798c33f9cc88962b0bffe0b6c))

## [0.4.0](https://github.com/Cammisuli/monodon/compare/rust-0.3.0...rust-0.4.0) (2023-01-05)


### Features

* **rust:** add cargo config ([#10](https://github.com/Cammisuli/monodon/issues/10)) ([9fc7137](https://github.com/Cammisuli/monodon/commit/9fc713754636b6c190e36a6b01d884b912383245))

## [0.3.0](https://github.com/Cammisuli/monodon/compare/rust-0.2.1...rust-0.3.0) (2023-01-04)


### Features

* **rust:** add napi-rs ([#9](https://github.com/Cammisuli/monodon/issues/9)) ([dcc7813](https://github.com/Cammisuli/monodon/commit/dcc7813d7b179d0af69423f44d5012e31cc2445f))

## [0.2.1](https://github.com/Cammisuli/monodon/compare/rust-0.2.0...rust-0.2.1) (2022-12-08)


### Bug Fixes

* **rust:** use execSync ([a053278](https://github.com/Cammisuli/monodon/commit/a05327892805d5944dcdc493ec7d6ee6fbc23ecf))

## [0.2.0](https://github.com/Cammisuli/monodon/compare/rust-0.1.0...rust-0.2.0) (2022-12-07)


### Features

* add rust preset ([#8](https://github.com/Cammisuli/monodon/issues/8)) ([82d6e32](https://github.com/Cammisuli/monodon/commit/82d6e32235b4e56810276db01c5276ec39273053))
* **rust:** add wasm support ([#6](https://github.com/Cammisuli/monodon/issues/6)) ([72fc0b2](https://github.com/Cammisuli/monodon/commit/72fc0b28a8f4b261c902d638fd982b2b6ba3410f))


### Bug Fixes

* **rust:** change release to production ([934e2a6](https://github.com/Cammisuli/monodon/commit/934e2a64c740485b395ead0e4cc881eba3e9e404))

## Initial
