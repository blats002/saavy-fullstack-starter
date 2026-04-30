export default class TestService {
    getTests() {
        return fetch('/api/tests')
            .then((res) => res.json())
            .then((data) => data || []);
    }

    createTest(test) {
        return fetch('/api/tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(test)
        }).then((res) => res.json());
    }

    deleteTest(id) {
        return fetch(`/api/tests/${id}`, {
            method: 'DELETE'
        });
    }
}
