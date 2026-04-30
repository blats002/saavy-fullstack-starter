<script setup>
import GenericCrud from '@/components/GenericCrud.vue';
import TestService from '@/service/TestService';

const testService = new TestService();

const testCrudService = {
  findAll: () => testService.getTests(),
  createOrUpdate: (test) => testService.saveTest(test),
  delete: (id) => testService.deleteTest(id)
};

const testFields = [
  {
    name: 'id',
    label: 'ID',
    type: 'text',
    sortable: true,
    displayInTable: true,
    displayInForm: true,
    hiddenInForm: true,
    editable: false,
    required: false,
    width: '10%'
  },
  {
    name: 'description',
    label: 'Description',
    type: 'text',
    sortable: true,
    displayInTable: true,
    displayInForm: true,
    hiddenInForm: false,
    editable: true,
    required: true,
    width: '40%'
  },
  {
    name: 'size',
    label: 'Size',
    type: 'number',
    sortable: true,
    displayInTable: true,
    displayInForm: true,
    hiddenInForm: false,
    editable: true,
    required: true,
    width: '20%'
  }
];

const createEmptyTest = () => ({
  description: '',
  size: null
});
</script>

<template>
  <GenericCrud
      title="Manage Tests"
      dialogHeader="Test Details"
      dataKey="id"
      :fields="testFields"
      :service="testCrudService"
      :createEmptyRecord="createEmptyTest"
      :messages="{
            created: 'Test Created',
            updated: 'Test Updated',
            deleted: 'Test Deleted',
            deletedMany: 'Tests Deleted'
        }"
  />
</template>