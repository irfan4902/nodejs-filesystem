const fs = require('fs');
const path = require('path');

// Absolute path to folder on the Desktop
const folderPath = 'C:/Users/irfan.aslam/Desktop/test folder';

fs.readdir(folderPath, (err, files) => {
    if (err) {
        console.error('Error reading folder:', err);
        return;
    }

    // console.log("List of all files in", folderPath, ":", files);
    console.log(`List of all files/folders in ${folderPath}: ${files}`);


    files.forEach(file => {
        // This is the absolute path of the file/folder
        const filePath = path.join(folderPath, file);

        fs.stat(filePath, (err, stats) => {
            if (err) {
                console.error('Error getting file stats:', err);
                return;
            }

            if (stats.isFile()) {
                console.log('File:', file);
            } else if (stats.isDirectory()) {
                console.log('Folder:', file);
            }



        });

    });

});
