import cn from 'classnames';
import React from 'react';
import Button from './Button';
import styles from './BackgroundPicker.module.scss';

export default function ({ setBackground, buttonClassName }) {

  const imageUpload = React.useRef();

  const onUpload = React.useCallback(
    e => {
      e.preventDefault();
      const files = imageUpload.current.files;
      if (FileReader && files && files.length) {
        const fr = new FileReader();
        fr.onload = function () {
          const img = new Image();
          img.src = fr.result;
          img.onload = function () {
            setBackground({
              url: fr.result,
              width: this.width,
              height: this.height
            });
          };
        };
        fr.readAsDataURL(files[0]);
      }
    },
    [setBackground]
  );

  return (
    <>      
      <input
        type="file"
        id="image-bg"
        className={styles.uploadInput}
        ref={imageUpload}
        onChange={onUpload}
      />
      <label htmlFor="image-bg">
        <Button
          tabIndex={-1}
          className={cn(styles.uploadButton, buttonClassName)}>
          Upload Background
        </Button>
      </label>
    </>
  );
}
