<?php

class PikatimeField extends InputField {
  static public $assets = array(
    'js' => array(
      'pikatime.js',
    ),
    'css' => array(
      'pikatime.css'
    )
  );

  public function input() {
    $input = parent::input();
    $input->data("field", "pikatime");
    return $input;
  }
}