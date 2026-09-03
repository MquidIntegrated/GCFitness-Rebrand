<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <title>GCFitness — Premium Performance Training Club</title>
    <meta name="description" content="GCFitness is a members-only performance club with elite coaches, 24/7 access, and a recovery zone engineered for real results.">
    <meta name="author" content="GCFitness">
    <meta property="og:title" content="GCFitness — Premium Performance Training Club">
    <meta property="og:description" content="Members-only performance club. Elite coaches, 24/7 access, recovery zone.">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="GCFitness">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap">

    <script>
        (function () {
            try {
                var t = localStorage.getItem('gcfitness-theme');
                var d = t || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                document.documentElement.classList.add(d);
            } catch (e) {
                document.documentElement.classList.add('dark');
            }
        })();
    </script>

    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
