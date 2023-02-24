<script lang="ts">
	import { t } from "svelte-i18n";
	import "../app.css";
</script>

<svelte:head>
	<title>{$t("title")}</title>
	<meta name="description" content={$t("description")} />
</svelte:head>

<slot />
