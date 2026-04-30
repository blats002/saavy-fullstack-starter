<script setup>
import { FilterMatchMode } from 'primevue/api';
import { ref, onBeforeMount, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    title: {
        type: String,
        default: 'Manage Records'
    },
    dialogHeader: {
        type: String,
        default: 'Record Details'
    },
    dataKey: {
        type: String,
        default: 'id'
    },
    fields: {
        type: Array,
        required: true
    },
    service: {
        type: Object,
        required: true
    },
    createEmptyRecord: {
        type: Function,
        default: () => ({})
    },
    messages: {
        type: Object,
        default: () => ({
            created: 'Record Created',
            updated: 'Record Updated',
            deleted: 'Record Deleted',
            deletedMany: 'Records Deleted'
        })
    }
});

const toast = useToast();

const records = ref([]);
const record = ref({});
const selectedRecords = ref(null);
const filters = ref({});
const submitted = ref(false);

const recordDialog = ref(false);
const deleteRecordDialog = ref(false);
const deleteRecordsDialog = ref(false);

onBeforeMount(() => {
    initFilters();
});

onMounted(() => {
    loadRecords();
});

const loadRecords = async () => {
    records.value = await props.service.findAll();
};

const openNew = () => {
    record.value = props.createEmptyRecord();
    submitted.value = false;
    recordDialog.value = true;
};

const hideDialog = () => {
    recordDialog.value = false;
    submitted.value = false;
};

const getEditableFields = () => {
  return props.fields.filter((field) => field.displayInForm);
};

const getTableFields = () => {
    return props.fields.filter((field) => field.displayInTable);
};

const isEmptyValue = (value) => {
    if (typeof value === 'string') {
        return value.trim() === '';
    }

    return value === null || value === undefined;
};

const hasFieldError = (fieldName) => {
    const field = props.fields.find((item) => item.name === fieldName);
    return submitted.value && field?.required && isEmptyValue(record.value[fieldName]);
};

const isValidRecord = () => {
    return props.fields.every((field) => {
        if (!field.required || !field.editable) {
            return true;
        }

        return !isEmptyValue(record.value[field.name]);
    });
};

const findIndexById = (id) => {
    return records.value.findIndex((item) => item[props.dataKey] === id);
};

const saveRecord = async () => {
    submitted.value = true;

    if (!isValidRecord()) {
        return;
    }

    const recordId = record.value[props.dataKey];

    if (recordId) {
        const updatedRecord = await props.service.createOrUpdate(record.value);

        const index = findIndexById(recordId);

        if (index !== -1) {
            records.value[index] = updatedRecord || { ...updatedRecord };
        }

        toast.add({
            severity: 'success',
            summary: 'Successful',
            detail: props.messages.updated,
            life: 3000
        });
    } else {
        const createdRecord = await props.service.createOrUpdate(record.value)

        records.value.push(createdRecord);

        toast.add({
            severity: 'success',
            summary: 'Successful',
            detail: props.messages.created,
            life: 3000
        });
    }

    recordDialog.value = false;
    record.value = props.createEmptyRecord();
};

const editRecord = (selectedRecord) => {
    record.value = { ...selectedRecord };
    submitted.value = false;
    recordDialog.value = true;
};

const confirmDeleteRecord = (selectedRecord) => {
    record.value = selectedRecord;
    deleteRecordDialog.value = true;
};

const deleteRecord = async () => {
    await props.service.delete(record.value[props.dataKey]);

    records.value = records.value.filter((item) => item[props.dataKey] !== record.value[props.dataKey]);
    deleteRecordDialog.value = false;
    record.value = props.createEmptyRecord();

    toast.add({
        severity: 'success',
        summary: 'Successful',
        detail: props.messages.deleted,
        life: 3000
    });
};

const confirmDeleteSelected = () => {
    deleteRecordsDialog.value = true;
};

const deleteSelectedRecords = async () => {
    if (!selectedRecords.value?.length) {
        return;
    }

    await Promise.all(selectedRecords.value.map((item) => props.service.delete(item[props.dataKey])));

    const selectedIds = selectedRecords.value.map((item) => item[props.dataKey]);
    records.value = records.value.filter((item) => !selectedIds.includes(item[props.dataKey]));

    deleteRecordsDialog.value = false;
    selectedRecords.value = null;

    toast.add({
        severity: 'success',
        summary: 'Successful',
        detail: props.messages.deletedMany,
        life: 3000
    });
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
                    <template #start>
                        <div class="my-2">
                            <Button label="New" icon="pi pi-plus" class="p-button-success mr-2" @click="openNew" />
                            <Button
                                label="Delete"
                                icon="pi pi-trash"
                                class="p-button-danger"
                                :disabled="!selectedRecords || !selectedRecords.length"
                                @click="confirmDeleteSelected"
                            />
                        </div>
                    </template>
                </Toolbar>

                <DataTable
                    :value="records"
                    v-model:selection="selectedRecords"
                    :dataKey="dataKey"
                    :paginator="true"
                    :rows="10"
                    :filters="filters"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    :rowsPerPageOptions="[5, 10, 25]"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    responsiveLayout="scroll"
                >
                    <template #header>
                        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                            <h5 class="m-0">{{ title }}</h5>

                            <span class="block mt-2 md:mt-0 p-input-icon-left">
                                <i class="pi pi-search" />
                                <InputText v-model="filters.global.value" placeholder="Search..." />
                            </span>
                        </div>
                    </template>

                    <Column selectionMode="multiple" headerStyle="width: 3rem" />

                    <Column
                        v-for="field in getTableFields()"
                        :key="field.name"
                        :field="field.name"
                        :header="field.label"
                        :sortable="field.sortable"
                        :headerStyle="`width:${field.width || 'auto'}; min-width:8rem;`"
                    >
                        <template #body="slotProps">
                            <span class="p-column-title">{{ field.label }}</span>
                            {{ slotProps.data[field.name] }}
                        </template>
                    </Column>

                    <Column headerStyle="min-width:10rem;">
                        <template #body="slotProps">
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="editRecord(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" @click="confirmDeleteRecord(slotProps.data)" />
                        </template>
                    </Column>
                </DataTable>

                <Dialog v-model:visible="recordDialog" :style="{ width: '600px' }" :header="dialogHeader" :modal="true" class="p-fluid">
                    <template v-for="field in getEditableFields()" :key="field.name">
                        <input
                            v-if="field.hiddenInForm"
                            :id="field.name"
                            v-model="record[field.name]"
                            type="hidden"
                        />

                        <div v-else-if="!field.editable" class="field">
                          <label :for="field.name">{{ field.label }}</label>
                          <InputText :id="field.name" :modelValue="record[field.name]" disabled />
                        </div>

                        <div v-else-if="field.type === 'text'" class="field">
                            <label :for="field.name">{{ field.label }}</label>
                            <InputText
                                :id="field.name"
                                v-model.trim="record[field.name]"
                                :class="{ 'p-invalid': hasFieldError(field.name) }"
                            />
                            <small v-if="hasFieldError(field.name)" class="p-invalid">
                                {{ field.label }} is required.
                            </small>
                        </div>

                        <div v-else-if="field.type === 'number'" class="field">
                            <label :for="field.name">{{ field.label }}</label>
                            <InputNumber
                                :id="field.name"
                                v-model="record[field.name]"
                                integeronly
                                :class="{ 'p-invalid': hasFieldError(field.name) }"
                            />
                            <small v-if="hasFieldError(field.name)" class="p-invalid">
                                {{ field.label }} is required.
                            </small>
                        </div>

                        <div v-else-if="field.type === 'textarea'" class="field">
                            <label :for="field.name">{{ field.label }}</label>
                            <Textarea
                                :id="field.name"
                                v-model="record[field.name]"
                                rows="3"
                                cols="20"
                                :class="{ 'p-invalid': hasFieldError(field.name) }"
                            />
                            <small v-if="hasFieldError(field.name)" class="p-invalid">
                                {{ field.label }} is required.
                            </small>
                        </div>

                        <div v-else-if="field.type === 'date'" class="field">
                            <label :for="field.name">{{ field.label }}</label>
                            <Calendar
                                :id="field.name"
                                v-model="record[field.name]"
                                :class="{ 'p-invalid': hasFieldError(field.name) }"
                            />
                            <small v-if="hasFieldError(field.name)" class="p-invalid">
                                {{ field.label }} is required.
                            </small>
                        </div>
                    </template>

                    <template #footer>
                        <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                        <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveRecord" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteRecordDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span>Are you sure you want to delete this record?</span>
                    </div>

                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteRecordDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteRecord" />
                    </template>
                </Dialog>

                <Dialog v-model:visible="deleteRecordsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
                    <div class="flex align-items-center justify-content-center">
                        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                        <span>Are you sure you want to delete the selected records?</span>
                    </div>

                    <template #footer>
                        <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteRecordsDialog = false" />
                        <Button label="Yes" icon="pi pi-check" class="p-button-text" @click="deleteSelectedRecords" />
                    </template>
                </Dialog>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss"></style>
