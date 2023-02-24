<script lang="ts">
	import { onMount } from "svelte";
	import { t } from "svelte-i18n";
	import { fade } from "svelte/transition";
	import * as THREE from "three";

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
			const dx =
				(((window.innerWidth / 2 - event.clientX) / window.innerWidth) * Math.PI) / 18;
			const dy =
				(((window.innerHeight / 2 - event.clientY) / window.innerHeight) * Math.PI) / 18;
			camera.rotation.x = Math.PI / 2 + dy;
			camera.rotation.y = Math.PI / 2 + dx;
		});

		animate();

		show_form = true;
	});

	function animate() {
		requestAnimationFrame(animate);

		for (const frame of frames) {
			frame.translateX(0.01);
			if (frame.position.x > 10) {
				frame.position.x = 0;
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
</script>

<div class="h-full w-full flex justify-center items-center p-2">
	<canvas
		class="absolute inset-0 w-full h-full transition-opacity opacity-0 -z-10"
		class:opacity-100={show_canvas}
	/>

	{#if show_form}
		<div class="prose text-white" transition:fade={{ delay: 1500 }}>
			<h1 class="text-white">{$t("pre-register")}</h1>
			<p>{$t("we-are-preparing")}</p>
			<p>{$t("get-notifications")}</p>

			<div class="form-control w-full">
				<label class="label" for="email">
					<span class="label-text text-white">{$t("email")}</span>
				</label>
				<input
					id="email"
					type="text"
					placeholder={$t("enter-your-email")}
					class="input input-primary input-bordered w-full"
				/>
				<label class="label" for="email">
					<span class="label-text-alt text-error">{email_error}</span>
					<span class="label-text-alt" />
				</label>
			</div>

			<button class="btn btn-primary px-6 float-right">{$t("submit")}</button>
		</div>
	{/if}
</div>
