// Test script to verify department creation API
const testDepartmentCreation = async () => {
  try {
    const testData = {
      code: 'TEST-DEPT',
      name: '测试部门',
      type: 'sales',
      region: '测试地区',
      description: '用于测试的部门'
    };

    console.log('Test data being sent:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://dev_backend:5000/api/v1/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You would need a real token
      },
      body: JSON.stringify(testData)
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (!response.ok) {
      console.error('Request failed with status:', response.status);
    } else {
      console.log('Department creation test successful!');
    }
  } catch (error) {
    console.error('Error testing department creation:', error);
  }
};

// Only run this if running directly with node
if (typeof window === 'undefined') {
  testDepartmentCreation();
}