<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onMounted, onBeforeMount } from 'vue';
import TestService from '@/service/TestService';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const tests = ref([]);
const testDialog = ref(false);
const deleteTestDialog = ref(false);
const deleteTestsDialog = ref(false);
const test = ref({});
const selectedTests = ref(null);
const dt = ref(null);
const filters = ref({});
const submitted = ref(false);

const testService = new TestService();

onBeforeMount(() => {
    initFilters();
});
onMounted(() => {
    loadTests();
});

const loadTests = () => {
    testService.getTests().then((data) => (tests.value = data));
};

const openNew = () => {
    test.value = {};
    submitted.value = false;
    testDialog.value = true;
};

const hideDialog = () => {
    testDialog.value = false;
    submitted.value = false;
};

const saveTest = async () => {
    submitted.value = true;

    if (test.value.text1 && test.value.text1.trim() && test.value.size != null) {
        if (test.value.id) {
            const index = findIndexById(test.value.id);
            tests.value[index] = { ...test.value };
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Test Updated', life: 3000 });
        } else {
            const createdTest = await testService.createTest(test.value);
            tests.value.push(createdTest);
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Test Created', life: 3000 });
        }

        testDialog.value = false;
        test.value = {};
    }
};

const editTest = (selectedTest) => {
    test.value = { ...selectedTest };
    testDialog.value = true;
};

const confirmDeleteTest = (selectedTest) => {
    test.value = selectedTest;
    deleteTestDialog.value = true;
};

const deleteTest = async () => {
    await testService.deleteTest(test.value.id);
    tests.value = tests.value.filter((val) => val.id !== test.value.id);
    deleteTestDialog.value = false;
    test.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Test Deleted', life: 3000 });
};

const findIndexById = (id) => {
    let index = -1;
    for (let i = 0; i < tests.value.length; i++) {
        if (tests.value[i].id === id) {
            index = i;
            break;
        }
    }
    return index;
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
    deleteTestsDialog.value = true;
};

const deleteSelectedTests = async () => {
    if (selectedTests.value && selectedTests.value.length) {
        await Promise.all(selectedTests.value.map((item) => testService.deleteTest(item.id)));
        tests.value = tests.value.filter((val) => !selectedTests.value.includes(val));
        deleteTestsDialog.value = false;
        selectedTests.value = null;
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Tests Deleted', life: 3000 });
    }
};

const initFilters = () => {
    filters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
</script>

<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <Toast />
                <Toolbar class="mb-4">
                    <template v-slot:start>
                        <div class="my-2">
                            <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
                            <Button label="Delete" icon="pi pi-trash" class="p-button-danger" @click="confirmDeleteSelected" :disabled="!selectedTests || !selectedTests.length" />
                        </div>
                    </template>
                </Toolbar>

                <DataTable
                    ref="dt"
                    :value="tests"
                    v-model:selection="selectedTests"
                    dataKey="id"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} tests"
                    responsiveLayout="scroll"
                >
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">Manage Tests</h5>
                            <span class="block mt-2 md:mt-0 p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters['global'].value" placeholder="Search..." />
                            </span>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
                    <Column field="id" header="ID" :sortable="true" headerStyle="width:10%; min-width:5rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">ID</span>
                            {{ slotProps.data.id }}
                        </template>
                    </Column>
                    <Column field="text1" header="Text" :sortable="true" headerStyle="width:40%; min-width:10rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Text</span>
                            {{ slotProps.data.text1 }}
                        </template>
                    </Column>
                    <Column field="size" header="Size" :sortable="true" headerStyle="width:20%; min-width:8rem;">
                        <template #body="slotProps">
                            <span class="p-column-title">Size</span>
                            {{ slotProps.data.size }}
                        </template>
                    </Column>
                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editTest(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteTest(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="testDialog" :style="{ width: '450px' }" header="Test Details" :modal="true" class="p-fluid">
                    <div class="field">
                        <label for="text1">Text</label>
                        <InputText id="text1" v-model.trim="test.text1" required="true" autofocus :class="{ 'p-invalid': submitted && !test.text1 }" />
                        <small class="p-invalid" v-if="submitted && !test.text1">Text is required.</small>
                    </div>

                    <div class="field">
                        <label for="size">Size</label>
                        <InputNumber id="size" v-model="test.size" integeronly :class="{ 'p-invalid': submitted && test.size == null }" required="true" />
                        <small class="p-invalid" v-if="submitted && test.size == null">Size is required.</small>
                    </div>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveTest" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteTestDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span v-if="test">
                            Are you sure you want to delete <b>{{ test.text1 }}</b>?
                        </span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteTestDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteTest" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteTestsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span>Are you sure you want to delete the selected tests?</span>
                    </div>
                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteTestsDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedTests" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
