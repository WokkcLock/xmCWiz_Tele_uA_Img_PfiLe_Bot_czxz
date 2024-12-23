export enum ImageFileExtEnum {
    jpg = 0,
    png, 
    gif,
    bmp, 
    tiff,
    svg,
    webp,
};


export enum ClientStateEnum {
    default, 
    remove_tags,
    patch_tags,
    add_tags,
    rename_kind,
}

export enum RatingEnum {
    disable,
    general,
    sensitive,
    questionable,
    explicit,
}