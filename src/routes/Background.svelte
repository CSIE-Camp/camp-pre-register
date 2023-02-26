<script lang="ts">
	import { page } from "$app/stores";
	import type Stats from "stats.js";
	import { onMount } from "svelte";
	import { cubicOut } from "svelte/easing";
	import { tweened } from "svelte/motion";
	import * as THREE from "three";
	import Helvetiker from "three/examples/fonts/helvetiker_regular.typeface.json";
	import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
	import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
	import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

	const DEPTH = 6;

	let show_canvas = false;
	let ratio = 1;
	let x = tweened(0, { duration: 300, easing: cubicOut });
	let y = tweened(0, { duration: 300, easing: cubicOut });

	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let stats: Stats;

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
		models.push(create_text());
		models.forEach((model) => scene.add(model.m));

		lines().forEach((line) => scene.add(line));

		camera = new THREE.PerspectiveCamera(75, ratio, 0.05, 2000);
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

		if ($page.url.searchParams.has("dev")) {
			const Stats = (await import("stats.js")).default;
			stats = new Stats();
			stats.showPanel(0);
			document.body.appendChild(stats.dom);
		}
	});

	let last = Date.now();
	function animate() {
		requestAnimationFrame(animate);

		stats?.begin();

		const offset = (Date.now() - last) / 5000;
		last = Date.now();
		for (const frame of frames) {
			frame.translateZ(offset);
			while (frame.position.z > 0) {
				frame.position.z -= DEPTH;
			}
		}
		for (let i = 0; i < models.length; i++) {
			const model = models[i];
			model.m.translateZ(offset * model.v);
			model.m.rotateZ(offset * Math.PI * model.w);
			while (model.m.position.z > 0) {
				if (model.t === "text") {
					scene.remove(model.m);
					model.m.clear();
					const m = create_text();
					models.splice(i, 1, m);
					scene.add(m.m);
					break;
				}

				model.m.position.z -= DEPTH;
				model.m.position.x = (1 - Math.random() * 2) * ratio * 0.5;
				model.m.position.y = 1 - Math.random() * 2;
				model.v = model.vg();
				model.w = model.wg();
			}
		}

		renderer.render(scene, camera);

		stats?.end();
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

	function lines() {
		const material = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 3 });
		const geometry = new THREE.BufferGeometry().setFromPoints([
			new THREE.Vector3(0, 0, 0),
			new THREE.Vector3(0, 0, -DEPTH),
		]);
		const line = new THREE.Line(geometry, material);

		const lines: THREE.Line[] = [];

		for (let i = 0; i < 10; i++) {
			add(-ratio + (i * ratio) / 5, -1);
			add(ratio, -1 + i / 5);
			add(-ratio + ((i + 1) * ratio) / 5, 1);
			add(-ratio, -1 + (i + 1) / 5);
		}

		function add(x: number, y: number) {
			const l = line.clone();
			l.position.set(x, y, 0);
			lines.push(l);
		}

		return lines;
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

	const messages = [
		"NTNU",
		"CSIE",
		"JS",
		"HTML",
		"SCSS",
		"Hugo",
		"Bot",
		"Security",
		"Crypto",
	].sort(() => Math.random() - 0.5);
	let message_index = 0;

	const loader = new FontLoader();
	const font = loader.parse(Helvetiker);
	const color_cyan = new THREE.Color(0x00cccc);
	const color_magenta = new THREE.Color(0xcc00cc);
	const color_yellow = new THREE.Color(0xcccc00);
	const color_key = new THREE.Color(0xcccccc);
	function create_text() {
		const message = messages[message_index++ % messages.length];
		const color = [color_cyan, color_yellow, color_magenta, color_key].sort(
			() => Math.random() - 0.5,
		)[0];
		const shapes = font.generateShapes(message, 0.2);
		const geometry = new THREE.ShapeGeometry(shapes);
		geometry.computeBoundingBox();

		// @ts-expect-error
		const x_mid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
		// @ts-expect-error
		const y_mid = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
		geometry.translate(x_mid, y_mid, 0);

		const holes: THREE.Path[] = [];

		for (const shape of shapes) {
			if (shape.holes) {
				for (const hole of shape.holes) {
					holes.push(hole);
				}
			}
		}

		// @ts-expect-error
		shapes.push.apply(shapes, holes);

		const style = SVGLoader.getStrokeStyle(0.005, color.getStyle(), "round", "round");

		const group = new THREE.Group();

		const material = new THREE.MeshBasicMaterial({ color });
		for (const shape of shapes) {
			const points = shape.getPoints();

			// @ts-expect-error
			const geometry = SVGLoader.pointsToStroke(points, style);
			geometry.translate(x_mid, y_mid, 0);

			const mesh = new THREE.Mesh(geometry, material);
			group.add(mesh);
		}

		group.position.set(
			(1 - Math.random() * 2) * ratio * 0.5,
			(1 - Math.random() * 2) * 0.5,
			-DEPTH,
		);

		return {
			m: group,
			vg: () => Math.random() * 3 + 1,
			v: Math.random() * 3 + 1,
			wg: () => 0,
			w: 0,
			t: "text",
		};
	}
</script>

<canvas
	class="absolute inset-0 w-full h-full transition-opacity opacity-0 -z-10 pointer-events-none"
	class:opacity-100={show_canvas}
/>
