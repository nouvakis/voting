<?php
declare(strict_types=1);

// ΣΗΜΑΝΤΙΚΟ: βάλε τα σωστά DB στοιχεία σου.
return [
  'db' => [
    'host' => '10.2.49.48:3306',
    'name' => 'nouvakis_voting',
    'user' => 'nouvakis_voting',
    'pass' => '533@P@533',
    'charset' => 'utf8mb4',
  ],
  'app' => [
    // Το public base path της εφαρμογής
    'base_url' => '/school/voting',
    // Το φυσικό path για uploads (μέσα στο project, γιατί δεν έχουμε server rules)
    'uploads_dir' => __DIR__ . '/../uploads',
  ],
  'security' => [
    'session_name' => 'VOTINGSESSID',
    'cors_allowed_origins' => [
      // Αν τρέχεις frontend από το ίδιο domain, δεν χρειάζεται CORS.
      // Άστο κενό για τώρα.
    ],
  ],
];
