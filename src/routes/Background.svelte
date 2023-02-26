<script lang="ts">
	import { onMount } from "svelte";
	import { cubicOut } from "svelte/easing";
	import { tweened } from "svelte/motion";
	import * as THREE from "three";
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

	const DEPTH = 6;

	let show_canvas = false;
	let show_form = false;
	let ratio = 1;
	let x = tweened(0, { duration: 300, easing: cubicOut });
	let y = tweened(0, { duration: 300, easing: cubicOut });

	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x192189);
	scene.fog = new THREE.Fog(0x192189, 1, 5);
	// scene.add(
	// 	new THREE.AxesHelper(5).setColors(
	// 		new THREE.Color(0xff0000),
	// 		new THREE.Color(0x00ff00),
	// 		new THREE.Color(0x0000ff),
	// 	),
	// );

	const frames: THREE.Line[] = [];
	const models: {
		m: THREE.Mesh | THREE.Group;
		vg: () => number;
		v: number;
		wg: () => number;
		w: number;
		t: string;
	}[] = [];

	onMount(async () => {
		ratio = window.innerWidth / window.innerHeight;
		show_canvas = true;
		const canvas = document.querySelector("canvas") || undefined;
		if (!canvas) {
			console.error("Canvas not found");
			return;
		}

		for (let i = 0; i < 10 * DEPTH; i++) {
			frames.push(frame(i / 10));
		}
		frames.forEach((frame) => scene.add(frame));

		models.push(...(await load_models()));
		models.forEach((num) => scene.add(num.m));

		camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 2000);
		camera.position.set(0, 0, 0);
		x.subscribe((value) => (camera.rotation.x = value));
		y.subscribe((value) => (camera.rotation.y = value));

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

		document.addEventListener("mousemove", (event) => move(event.clientX, event.clientY));
		document.addEventListener("touchmove", (event) =>
			move(
				[...event.touches].reduce((a, b) => a + b.clientX, 0) / event.touches.length,
				[...event.touches].reduce((a, b) => a + b.clientY, 0) / event.touches.length,
			),
		);

		animate();

		show_form = true;
	});

	let last = Date.now();
	function animate() {
		requestAnimationFrame(animate);

		const offset = (Date.now() - last) / 5000;
		last = Date.now();
		for (const frame of frames) {
			frame.translateZ(offset);
			while (frame.position.z > 0) {
				frame.position.z -= DEPTH;
			}
		}
		for (const model of models) {
			model.m.translateZ(offset * model.v);
			model.m.rotateZ(offset * Math.PI * model.w);
			while (model.m.position.z > 0) {
				model.m.position.z -= DEPTH;
				model.m.position.x = (1 - Math.random() * 2) * ratio * 0.5;
				model.m.position.y = 1 - Math.random() * 2;
				model.v = model.vg();
				model.w = model.wg();
			}
		}

		renderer.render(scene, camera);
	}

	function frame(distance = 10) {
		const geometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(ratio * 2, 0, 0),
			new THREE.Vector3(ratio * 2, 2, 0),
			new THREE.Vector3(0, 2, 0),
			new THREE.Vector3(0, 0, 0),
		]);

		const material = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 3 });
		const line = new THREE.Line(geometry, material);
		line.position.set(-ratio, -1, DEPTH - distance);
		return line;
	}

	function move(x: number, y: number) {
		const dy = (((window.innerWidth / 2 - x) / window.innerWidth) * Math.PI) / 18;
		const dx = (((window.innerHeight / 2 - y) / window.innerHeight) * Math.PI) / 18;
		$x = dx;
		$y = dy;
	}

	async function load_models() {
		const loader = new GLTFLoader();

		const M = await Promise.all(
			["/3d/num0.glb", "/3d/num1.glb"].map((src) => loader.loadAsync(src)),
		);

		const models: {
			m: THREE.Mesh | THREE.Group;
			vg: () => number;
			v: number;
			wg: () => number;
			w: number;
			t: string;
		}[] = [];
		for (let i = 0; i < 10; i++) {
			const m = M[i % 2];
			const mesh = m.scene.children[0] as THREE.Mesh;

			const vg = () => Math.random() * 15 + 3;
			const wg = () => Math.PI * (Math.random() * 2 - 1);
			const t = "num";

			mesh.material = new THREE.MeshBasicMaterial({ color: 0xcccccc });

			mesh.position.set(
				0,
				(1 - Math.random() * 2) * ratio * 0.5,
				(1 - Math.random() * 2) * 0.5,
			);
			models.push({
				m: mesh,
				vg,
				v: vg(),
				wg,
				w: wg(),
				t,
			});
		}

		return models;
	}
</script>

<canvas
	class="absolute inset-0 w-full h-full transition-opacity opacity-0 -z-10 pointer-events-none"
	class:opacity-100={show_canvas}
/>
