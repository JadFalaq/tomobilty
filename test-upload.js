const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    const formData = new FormData();
    // Use an existing file, e.g., create a dummy one if needed or use logo.png
    const filePath = path.join(__dirname, 'public', 'logo.png');
    
    if (!fs.existsSync(filePath)) {
        console.error('Logo not found, creating dummy file');
        fs.writeFileSync('test.txt', 'test content');
        formData.append('image', fs.createReadStream('test.txt'));
    } else {
        formData.append('image', fs.createReadStream(filePath));
    }

    console.log('Uploading to http://localhost:8000/api/upload/single...');
    const res = await axios.post('http://localhost:8000/api/upload/single', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log('Upload success:', res.data);
    
    // Verify file access
    const fileUrl = `http://localhost:8000${res.data.url}`;
    console.log('Verifying file access at:', fileUrl);
    
    const fileRes = await axios.get(fileUrl);
    console.log('File access status:', fileRes.status);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testUpload();
