<script lang="ts">
	import { onMount } from "svelte";
	import { t } from "svelte-i18n";
	import { fade } from "svelte/transition";
	import { z } from "zod";
	import Background from "./Background.svelte";

	let webgl_ok = false;
	let show_form = false;
	let bg: Background;

	onMount(async () => {
		webgl_ok = (() => {
			try {
				const canvas = document.createElement("canvas");
				return !!(
					!!window.WebGLRenderingContext &&
					(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
				);
			} catch (e) {
				return false;
			}
		})();

		if (!webgl_ok) {
			setTimeout(() => {
				show_form = true;
			}, 100);
		}
	});

	let email_error = "";
	let success = false;
	$: {
		if (success) {
			for (let i = 0; i < 60; i++) {
				setTimeout(() => bg.write("Thanks!", 0.1), i * 50);
			}
		}
	}
	let email = "";
	let submitting = false;
	async function submit() {
		if (submitting) {
			return;
		}
		submitting = true;

		try {
			if (!email) {
				throw new Error("請輸入電子郵件");
			}

			try {
				z.string().email().max(128).parse(email);
			} catch {
				throw new Error("電子郵件格式錯誤");
			}

			const res = await fetch("/submit?email=" + email);
			if (res.status === 200) {
				const { success: s, error } = await res.json<{ success: boolean; error: string }>();
				if (s) {
					success = true;
				} else {
					throw new Error(error);
				}
			} else {
				throw new Error("網路錯誤");
			}
		} catch (err) {
			if (err instanceof Error) {
				email_error = err.message;
			}
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<link rel="canonical" href="https://camp.csie.cool/" />
</svelte:head>

<div class="h-full w-full flex justify-center items-center p-2">
	<Background on:ready|once={() => (show_form = true)} bind:this={bg} />

	{#if show_form}
		<div class="prose" class:text-white={webgl_ok} transition:fade={{ delay: 1500 }}>
			<h1 class:text-white={webgl_ok}>{$t("pre-register")}</h1>
			<p>{$t("we-are-preparing")}</p>
			<p>{$t("get-notifications")}</p>

			{#if success}
				<p transition:fade={{ duration: 300, delay: 300 }}>
					{$t("success", { values: { email } })}
				</p>
			{:else}
				<div class="w-full" transition:fade={{ duration: 300 }}>
					<div class="form-control w-full">
						<label class="label" for="email">
							<span class="label-text" class:text-white={webgl_ok}>{$t("email")}</span
							>
						</label>
						<input
							id="email"
							type="text"
							placeholder={$t("enter-your-email")}
							bind:value={email}
							class="input input-primary input-bordered w-full text-primary"
							on:keydown={(e) => {
								const { key } = e;
								if (/^[a-zA-Z0-9@._+-]$/.test(key)) {
									bg.write(key);
								}
							}}
						/>
						<label class="label" for="email">
							<span class="label-text-alt text-error">{email_error}</span>
							<span class="label-text-alt" />
						</label>
					</div>

					<button
						class="btn btn-primary px-6 float-right"
						on:click={submit}
						disabled={submitting}
					>
						{$t("submit")}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
