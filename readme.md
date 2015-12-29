# Pikatime - Kirby Time Picking Field

This panel field for [Kirby](http://getkirby.com) is a better time picker than the default supplied with Kirby.

License: [MIT](http://opensource.org/licenses/MIT)

![Screenshot](https://raw.githubusercontent.com/Jayshua/kirby-pikatime/master/example.png)

## Installation

### Copy & Pasting

If not already existing, add a new `fields` folder to your `site` directory. Then copy or link this repositories whole content in a new `pikatime` folder there. Afterwards, your directory structure should look like this:

```yaml
site/
    fields/
        pikatime/
            assests/
            pikatime.php
```

### Git Submodule

If you would prefer to use a Git Submodule (which is more elegant in my opinion) you may follow along like this.

```bash
$ cd your/project/root
$ git submodule add https://github.com/jayshua/kirby-pikatime.git site/fields/pikatime
```

## Usage

### In blueprints

```yaml
fields:
    time:
        label: Event Time
        type:  pikatime
```

### In templates

The pikatime field only saves time in basic 24-hour format. You can use the PHP date/time functions to format them as desired. See [strtotime](http://php.net/manual/en/function.strtotime.php) and [Date/Time Functions](http://php.net/manual/en/ref.datetime.php) on the PHP website.