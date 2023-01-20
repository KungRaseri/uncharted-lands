<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="mt-5 mx-auto w-full sm:w-1/2">
	<div class="bg-slate-50 rounded-md px-5 py-3">
		<div class="mb-5 -ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
			<div class="ml-4 mt-4">
				<h3 class="text-lg font-medium leading-6 text-gray-900">Account Details</h3>
			</div>
			<div class="ml-4 mt-4 flex-shrink-0">
				<button
					type="button"
					class="relative inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					Edit Account
				</button>
			</div>
		</div>
		<div class="border-t border-gray-200 px-4">
			<dl class="sm:divide-y sm:divide-gray-200">
				<div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
					<dt class="text-sm font-medium text-gray-500">ID</dt>
					<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.account?.id}</dd>
				</div>
				<div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
					<dt class="text-sm font-medium text-gray-500">Email address</dt>
					<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.account?.email}</dd>
				</div>
				<div class="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
					<dt class="text-sm font-medium text-gray-500">Role</dt>
					<dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{data.account?.role}</dd>
				</div>
			</dl>
		</div>
	</div>
</div>
