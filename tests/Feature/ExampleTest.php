<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_the_root_redirects_to_workspaces(): void
    {
        $this->get('/')->assertRedirect('/workspaces');
    }

}
