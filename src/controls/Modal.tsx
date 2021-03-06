import * as PropTypes from 'prop-types';
import * as React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap';

class MyModal extends React.PureComponent<typeof Modal.prototype.props, {}> {
  public static Header: typeof ModalHeader = Modal.Header;
  public static Title: typeof ModalTitle = Modal.Title;
  public static Body: typeof ModalBody = Modal.Body;
  public static Footer: typeof ModalFooter = Modal.Footer;

  public static childContextTypes: React.ValidationMap<any> = {
    menuLayer: PropTypes.object,
  };

  private mMenuLayer: Element = null;

  public getChildContext(): any {
    return { ...this.context, menuLayer: this.mMenuLayer };
  }

  public render(): JSX.Element {
    return (
      <div className='modal-container'>
        <Modal {...this.props}>
          <div className='menu-layer' ref={this.setMenuLayer}/>
          {this.mMenuLayer !== null ? this.props.children : null}
        </Modal>
      </div>
    );
  }

  private setMenuLayer = (ref: Element) => {
    this.mMenuLayer = ref;
    this.forceUpdate();
  }
}

export default MyModal;
