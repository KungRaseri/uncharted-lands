import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
	vus: 10,
	stages: [
		{ duration: '15s', target: 20 },
		{ duration: '30s', target: 10 },
		{ duration: '1m15s', target: 0 }
	]
};

export default function () {
	const res = http.get('http://localhost:3000');

	check(res, { 'status was 200': (r) => r.status == 200 });
	sleep(1);
}
