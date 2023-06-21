<?php
if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    $tempFilePath = $file['tmp_name'];
    $fileName = $file['name'];
    $targetPath = "../plaques/" . $fileName;
    
    if (move_uploaded_file($tempFilePath, $targetPath)) {
        echo "Image saved successfully.";
    } else {
        echo "Failed to save the image.";
    }
} else {
    echo "No file received.";
}
?>
