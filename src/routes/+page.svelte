<script lang="ts">
	import { onMount } from "svelte";
	import { t } from "svelte-i18n";
	import { fade } from "svelte/transition";
	import * as THREE from "three";
	import { z } from "zod";

	let webgl_ok = false;
	let show_canvas = false;
	let show_form = false;
	let ratio = 1;

	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x192189);
	scene.fog = new THREE.Fog(0x192189, 1, 5);
	scene.add(
		new THREE.AxesHelper(5).setColors(
			new THREE.Color(0xff0000),
			new THREE.Color(0x00ff00),
			new THREE.Color(0x0000ff),
		),
	);

	const frames: THREE.Line[] = [];

	onMount(() => {
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

		ratio = window.innerWidth / window.innerHeight;
		show_canvas = true;
		const canvas = document.querySelector("canvas") || undefined;
		if (!canvas) {
			console.error("Canvas not found");
			return;
		}

		for (let i = 0; i < 100; i++) {
			frames.push(frame(i / 10));
		}
		frames.forEach((frame) => scene.add(frame));

		camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 2000);
		camera.position.set(10, 0, 0);
		camera.lookAt(0, 0, 0);
		camera.rotateZ(Math.PI / 2);

		renderer = new THREE.WebGLRenderer({ canvas });
		renderer.setSize(window.innerWidth, window.innerHeight);

		window.addEventListener("resize", () => {
			ratio = window.innerWidth / window.innerHeight;
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			camera.aspect = ratio;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});

		document.addEventListener("mousemove", (event) => {
			const dy =
				(((window.innerWidth / 2 - event.clientX) / window.innerWidth) * Math.PI) / 18;
			const dx =
				(((window.innerHeight / 2 - event.clientY) / window.innerHeight) * Math.PI) / 18;
			camera.rotation.x = Math.PI / 2 - dx;
			camera.rotation.y = Math.PI / 2 + dy;
		});

		animate();

		show_form = true;
	});

	let last = Date.now();
	function animate() {
		requestAnimationFrame(animate);

		const offset = (Date.now() - last) / 5000;
		last = Date.now();
		for (const frame of frames) {
			frame.translateX(offset);
			while (frame.position.x > 10) {
				frame.position.x -= 10;
			}
		}

		renderer.render(scene, camera);
	}

	function frame(distance = 10) {
		const geometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, ratio, 0),
			new THREE.Vector3(0, ratio, 1),
			new THREE.Vector3(0, 0, 1),
			new THREE.Vector3(0, 0, 0),
		]);

		const material = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
		material.transparent = true;
		material.opacity = 0.5;
		const line = new THREE.Line(geometry, material);
		line.position.set(10 - distance, -ratio / 2, -0.5);
		return line;
	}

	let email_error = "";
	let success = false;
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

<div class="h-full w-full flex justify-center items-center p-2">
	<canvas
		class="absolute inset-0 w-full h-full transition-opacity opacity-0 -z-10"
		class:opacity-100={show_canvas}
	/>

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
