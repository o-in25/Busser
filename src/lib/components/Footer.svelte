<script lang="ts">
  import { Instagram, Facebook, Twitter, Github } from "lucide-svelte";
  import logo from '$lib/assets/logo.png'
  </script>

<footer class="mt-auto glass-nav border-t border-b-0 rounded-none">
  <div class="w-full mx-auto max-w-screen-xl p-4 md:p-6 flex flex-col gap-8">
    <!-- Row 1: Logo + Links -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <!-- Logo -->
      <div class="flex-shrink-0">
        <a href="/" class="hover:opacity-80 transition-opacity">
          <img src={logo} alt="Busser" class="h-32" />
        </a>
      </div>

      <!-- Links -->
      <div class="flex flex-wrap justify-start gap-12">
        <!-- Legal -->
        <div class="min-w-[120px]">
          <h3 class="text-sm font-semibold text-heading uppercase mb-3">Legal</h3>
          <ul class="text-sm text-muted-foreground space-y-2">
            <li><a href="/privacy" class="hover:text-foreground transition-colors">Privacy Policy</a></li>
            <li><a href="/terms" class="hover:text-foreground transition-colors">Terms of Service</a></li>
            <li><a href="/cookies" class="hover:text-foreground transition-colors">Cookie Policy</a></li>
          </ul>
        </div>

        <!-- Help -->
        <div class="min-w-[120px]">
          <h3 class="text-sm font-semibold text-heading uppercase mb-3">Help</h3>
          <ul class="text-sm text-muted-foreground space-y-2">
            <li><a href="/about" class="hover:text-foreground transition-colors">About</a></li>
          </ul>
        </div>

        <!-- Contribute -->
        <div class="min-w-[120px]">
          <h3 class="text-sm font-semibold text-heading uppercase mb-3">Contribute</h3>
          <ul class="text-sm text-muted-foreground space-y-2">
            <li><a href="https://github.com" class="hover:text-foreground transition-colors">GitHub</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Row 2: Copyright + Social Icons -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
      <span class="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Busser. All rights reserved.
      </span>

      <div class="flex gap-4">
        <a href="https://instagram.com" class="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
          <Instagram class="w-5 h-5" />
        </a>
        <a href="https://facebook.com" class="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
          <Facebook class="w-5 h-5" />
        </a>
        <a href="https://twitter.com" class="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
          <Twitter class="w-5 h-5" />
        </a>
        <a href="https://github.com" class="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
          <Github class="w-5 h-5" />
        </a>
      </div>
    </div>
  </div>
</footer>
