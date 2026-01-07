fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### create_app

```sh
[bundle exec] fastlane create_app
```

Create app in App Store Connect & Developer Portal

----


## iOS

### ios signing

```sh
[bundle exec] fastlane ios signing
```

Sync signing certificates & profiles

### ios build

```sh
[bundle exec] fastlane ios build
```

Build App Store archive

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Build & upload to TestFlight

### ios release

```sh
[bundle exec] fastlane ios release
```

Submit app for App Store review and auto-release

### ios validate_metadata

```sh
[bundle exec] fastlane ios validate_metadata
```

Validate App Store Connect metadata completeness (no upload)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
